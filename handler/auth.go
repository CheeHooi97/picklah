package handler

import (
	"errors"
	"github.com/CheeHooi97/picklah/config"
	"github.com/CheeHooi97/picklah/model"
	"github.com/CheeHooi97/picklah/service"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"net/http"
	"time"
)

const sessionCookie = "picklah_session"

func authError(c echo.Context, status int, code, message string) error {
	return c.JSON(status, map[string]any{"error": map[string]string{"code": code, "message": message}})
}
func authCookie(name, value string, seconds int) *http.Cookie {
	return &http.Cookie{Name: name, Value: value, Path: "/v1", MaxAge: seconds, Expires: time.Now().Add(time.Duration(seconds) * time.Second), HttpOnly: true, Secure: config.Env != "development", SameSite: http.SameSiteLaxMode}
}
func (h *Handler) authResponse(c echo.Context, account *model.Account) error {
	token, err := h.Auth.NewSession(c.Request().Context(), account.ID)
	if err != nil {
		return authError(c, 500, "AUTH_UNAVAILABLE", "Sign-in is unavailable. Please try again.")
	}
	// Rotate the current browser session on every successful authentication.
	if cookie, err := c.Cookie(sessionCookie); err == nil {
		_ = h.Auth.Logout(c.Request().Context(), cookie.Value)
	}
	c.SetCookie(authCookie(sessionCookie, token, 7*24*60*60))
	c.Response().Header().Set("Cache-Control", "no-store")
	return c.JSON(http.StatusOK, map[string]any{"account": account})
}
func (h *Handler) Register(c echo.Context) error {
	var request struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if c.Bind(&request) != nil {
		return authError(c, 400, "INVALID_REQUEST", "Enter a username and password.")
	}
	account, err := h.Auth.Register(c.Request().Context(), request.Username, request.Password)
	if errors.Is(err, service.ErrAuthInvalid) {
		return authError(c, 400, "INVALID_ACCOUNT", "Use 3–32 letters, numbers or underscores for your username and a password of 10–72 bytes.")
	}
	if errors.Is(err, service.ErrUsernameTaken) {
		return authError(c, 409, "USERNAME_TAKEN", "That username is unavailable. Choose another.")
	}
	if err != nil {
		return authError(c, 500, "AUTH_UNAVAILABLE", "Registration is unavailable. Please try again.")
	}
	return h.authResponse(c, account)
}
func (h *Handler) Login(c echo.Context) error {
	var request struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if c.Bind(&request) != nil {
		return authError(c, 400, "INVALID_REQUEST", "Enter a username and password.")
	}
	account, err := h.Auth.Login(c.Request().Context(), request.Username, request.Password)
	if errors.Is(err, service.ErrAuthInvalid) {
		return authError(c, 401, "INVALID_CREDENTIALS", "The username or password is incorrect.")
	}
	if err != nil {
		return authError(c, 500, "AUTH_UNAVAILABLE", "Sign-in is unavailable. Please try again.")
	}
	return h.authResponse(c, account)
}
func (h *Handler) AuthConfig(c echo.Context) error {
	return c.JSON(200, map[string]any{"googleConfigured": googleOAuthConfigured(), "nativeGoogleConfigured": config.GoogleOAuthClientID != "", "googleClientId": config.GoogleOAuthClientID})
}

func (h *Handler) NativeGoogleChallenge(c echo.Context) error {
	if config.GoogleOAuthClientID == "" {
		return authError(c, 503, "GOOGLE_UNAVAILABLE", "Google sign-in is not configured on the server.")
	}
	nonce, err := h.Auth.NewGoogleChallenge(c.Request().Context())
	if err != nil {
		return authError(c, 503, "AUTH_UNAVAILABLE", "Google sign-in is unavailable. Please try again.")
	}
	return c.JSON(200, map[string]string{"nonce": nonce, "clientId": config.GoogleOAuthClientID})
}

func (h *Handler) NativeGoogle(c echo.Context) error {
	var request struct {
		IDToken string `json:"idToken"`
		Nonce   string `json:"nonce"`
	}
	if c.Bind(&request) != nil {
		return authError(c, 400, "INVALID_REQUEST", "Invalid Google sign-in request.")
	}
	if config.GoogleOAuthClientID == "" {
		return authError(c, 503, "GOOGLE_UNAVAILABLE", "Google sign-in is not configured on the server.")
	}
	account, err := h.Auth.NativeGoogle(c.Request().Context(), request.IDToken, request.Nonce, config.GoogleOAuthClientID)
	if errors.Is(err, service.ErrAuthInvalid) {
		return authError(c, 401, "GOOGLE_INVALID", "Google sign-in expired or could not be verified. Please try again.")
	}
	if err != nil {
		return authError(c, 503, "AUTH_UNAVAILABLE", "Google sign-in is unavailable. Please try again.")
	}
	return h.authResponse(c, account)
}
func (h *Handler) CurrentAccount(c echo.Context) error {
	c.Response().Header().Set("Cache-Control", "no-store")
	cookie, err := c.Cookie(sessionCookie)
	if err != nil {
		return c.JSON(200, map[string]any{"account": nil})
	}
	account, err := h.Auth.Current(c.Request().Context(), cookie.Value)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.SetCookie(authCookie(sessionCookie, "", -1))
		return c.JSON(200, map[string]any{"account": nil})
	}
	if err != nil {
		return authError(c, 503, "AUTH_UNAVAILABLE", "Account status is unavailable. Please try again.")
	}
	return c.JSON(200, map[string]any{"account": account})
}
func (h *Handler) Logout(c echo.Context) error {
	if cookie, err := c.Cookie(sessionCookie); err == nil {
		if err = h.Auth.Logout(c.Request().Context(), cookie.Value); err != nil {
			return authError(c, 503, "AUTH_UNAVAILABLE", "Could not sign out. Please try again.")
		}
	}
	c.SetCookie(authCookie(sessionCookie, "", -1))
	return c.NoContent(204)
}
