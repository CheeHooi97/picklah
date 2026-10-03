package router

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/CheeHooi97/picklah/config"
	"github.com/CheeHooi97/picklah/handler"
	"github.com/CheeHooi97/picklah/middleware"
	"github.com/CheeHooi97/picklah/repository"
	"github.com/CheeHooi97/picklah/service"
	"github.com/CheeHooi97/picklah/utils"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func SetupRoutes(h *handler.Handler, db *gorm.DB) *echo.Echo {
	e := echo.New()
	e.Validator = utils.NewValidator()
	e.HTTPErrorHandler = func(err error, c echo.Context) {
		if c.Response().Committed {
			return
		}
		c.Logger().Errorf("request failed: %v", err)
		status := http.StatusInternalServerError
		if httpErr, ok := err.(*echo.HTTPError); ok && httpErr.Code < 500 {
			status = httpErr.Code
		}
		_ = c.JSON(status, map[string]any{"error": map[string]string{"code": "REQUEST_ERROR", "message": "The request could not be completed."}})
	}
	e.Use(requestGuard(config.AllowedOrigins))
	h.Auth = service.NewAuthService(repository.NewAccountRepository(db))
	auth := e.Group("/v1/auth")
	auth.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Response().Header().Set("Cache-Control", "no-store")
			if c.Request().Method == http.MethodPost && !strings.HasPrefix(c.Request().Header.Get(echo.HeaderContentType), echo.MIMEApplicationJSON) {
				return echo.NewHTTPError(http.StatusUnsupportedMediaType)
			}
			return next(c)
		}
	})
	auth.GET("/config", h.AuthConfig, middleware.NewFixedWindowLimiter(30, time.Minute))
	auth.GET("/oauth/google/start", h.GoogleOAuthStart, middleware.NewFixedWindowLimiter(20, time.Minute))
	auth.GET("/oauth/google/callback", h.GoogleOAuthCallback, middleware.NewFixedWindowLimiter(20, time.Minute))
	auth.GET("/me", h.CurrentAccount)
	auth.POST("/register", h.Register, middleware.NewFixedWindowLimiter(5, time.Minute))
	auth.POST("/login", h.Login, middleware.NewFixedWindowLimiter(10, time.Minute))
	auth.POST("/logout", h.Logout)

	public := e.Group("/v1")
	public.GET("/templates", h.ListTemplates)
	public.POST("/wheels", h.CreateWheel, middleware.RequireWheelSubscription, middleware.NewFixedWindowLimiter(20, time.Minute))
	public.GET("/wheels/:publicId", h.GetWheel, middleware.NewFixedWindowLimiter(120, time.Minute))

	// Existing account routes remain company-authenticated.
	v := e.Group("/v1", middleware.Authenticate(db))
	user := v.Group("/user")
	user.GET("", h.GetUser)
	user.POST("/search", h.SearchUserWithoutCheckUserId)
	user.POST("", h.CreateUser)
	user.POST("/update/:id", h.UpdateUser)
	user.DELETE("/delete/:id", h.DeleteUser)

	admin := v.Group("/admin")
	admin.GET("", h.GetAdmin)
	admin.GET("/admins", h.GetAllAdmins)
	admin.POST("", h.CreateAdmin)
	admin.POST("/update/:id", h.UpdateAdmin)
	admin.DELETE("/delete/:id", h.DeleteAdmin)

	return e
}

func requestGuard(allowedOrigins []string) echo.MiddlewareFunc {
	allowed := make(map[string]struct{}, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		allowed[strings.TrimSpace(origin)] = struct{}{}
	}
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) (err error) {
			defer func() {
				if recovered := recover(); recovered != nil {
					c.Logger().Errorf("panic recovered: %v", recovered)
					c.Echo().HTTPErrorHandler(fmt.Errorf("request panic"), c)
					err = nil
				}
			}()

			origin := c.Request().Header.Get(echo.HeaderOrigin)
			if origin != "" {
				if _, ok := allowed[origin]; !ok {
					return echo.NewHTTPError(http.StatusForbidden, "origin is not allowed")
				}
				c.Response().Header().Set(echo.HeaderAccessControlAllowOrigin, origin)
				c.Response().Header().Set(echo.HeaderAccessControlAllowCredentials, "true")
				c.Response().Header().Add(echo.HeaderVary, echo.HeaderOrigin)
				c.Response().Header().Set(echo.HeaderAccessControlAllowMethods, "GET, POST, OPTIONS")
				c.Response().Header().Set(echo.HeaderAccessControlAllowHeaders, "Content-Type, Authorization")
			}
			if c.Request().Method == http.MethodOptions {
				return c.NoContent(http.StatusNoContent)
			}
			if c.Request().Body != nil {
				limit := int64(64 << 10)
				if c.Request().Method == http.MethodPost && c.Request().URL.Path == "/v1/wheels" {
					limit = 3 << 20 // Includes bounded embedded images and choice metadata.
				}
				c.Request().Body = http.MaxBytesReader(c.Response(), c.Request().Body, limit)
			}
			return next(c)
		}
	}
}
