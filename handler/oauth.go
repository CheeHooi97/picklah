package handler

import (
	"context"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/CheeHooi97/picklah/config"
	"github.com/labstack/echo/v4"
	"golang.org/x/oauth2"
)

const googleFlowCookie = "picklah_google_flow"

type googleFlow struct {
	State    string `json:"state"`
	Nonce    string `json:"nonce"`
	Verifier string `json:"verifier"`
	Path     string `json:"path"`
}

func googleOAuthConfig() oauth2.Config {
	return oauth2.Config{
		ClientID: config.GoogleOAuthClientID, ClientSecret: config.GoogleOAuthClientSecret,
		RedirectURL: config.GoogleOAuthRedirectURL,
		Scopes:      []string{"openid", "email", "profile"},
		Endpoint:    oauth2.Endpoint{AuthURL: "https://accounts.google.com/o/oauth2/v2/auth", TokenURL: "https://oauth2.googleapis.com/token", AuthStyle: oauth2.AuthStyleInParams},
	}
}

func googleOAuthConfigured() bool {
	return strings.TrimSpace(config.GoogleOAuthClientID) != "" && strings.TrimSpace(config.GoogleOAuthClientSecret) != ""
}

func oauthReturn(c echo.Context, path, result string) error {
	if path != "/" && !strings.HasPrefix(path, "/w/") {
		path = "/"
	}
	target, err := url.Parse(config.PicklahSiteURL + path)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError)
	}
	query := target.Query()
	query.Set("oauth", result)
	target.RawQuery = query.Encode()
	return c.Redirect(http.StatusFound, target.String())
}

func (h *Handler) GoogleOAuthStart(c echo.Context) error {
	path := c.QueryParam("return_path")
	// Only wheel routes can be restored. Never accept a client-supplied origin.
	if path != "/" && !strings.HasPrefix(path, "/w/") {
		path = "/"
	}
	parsed, err := url.Parse(path)
	if err != nil || parsed.IsAbs() || parsed.Host != "" || parsed.RawQuery != "" || parsed.Fragment != "" || strings.Contains(path, "\\") {
		path = "/"
	}
	if !googleOAuthConfigured() {
		return oauthReturn(c, path, "oauth_unavailable")
	}
	flow := googleFlow{State: oauth2.GenerateVerifier(), Nonce: oauth2.GenerateVerifier(), Verifier: oauth2.GenerateVerifier(), Path: path}
	data, err := json.Marshal(flow)
	if err != nil {
		return oauthReturn(c, path, "oauth_failed")
	}
	c.SetCookie(authCookie(googleFlowCookie, base64.RawURLEncoding.EncodeToString(data), 10*60))
	oauthConfig := googleOAuthConfig()
	target := oauthConfig.AuthCodeURL(flow.State, oauth2.S256ChallengeOption(flow.Verifier), oauth2.SetAuthURLParam("nonce", flow.Nonce), oauth2.SetAuthURLParam("prompt", "select_account"))
	return c.Redirect(http.StatusFound, target)
}

func (h *Handler) GoogleOAuthCallback(c echo.Context) error {
	c.Response().Header().Set("Referrer-Policy", "no-referrer")
	cookie, err := c.Cookie(googleFlowCookie)
	c.SetCookie(authCookie(googleFlowCookie, "", -1))
	var flow googleFlow
	if err != nil {
		return oauthReturn(c, "/", "oauth_state_invalid")
	}
	data, err := base64.RawURLEncoding.DecodeString(cookie.Value)
	if err != nil || json.Unmarshal(data, &flow) != nil || flow.State == "" || flow.Nonce == "" || flow.Verifier == "" || subtle.ConstantTimeCompare([]byte(flow.State), []byte(c.QueryParam("state"))) != 1 {
		return oauthReturn(c, "/", "oauth_state_invalid")
	}
	if c.QueryParam("error") != "" {
		return oauthReturn(c, flow.Path, "oauth_cancelled")
	}
	if !googleOAuthConfigured() || c.QueryParam("code") == "" {
		return oauthReturn(c, flow.Path, "oauth_unavailable")
	}
	ctx, cancel := context.WithTimeout(c.Request().Context(), 15*time.Second)
	defer cancel()
	ctx = context.WithValue(ctx, oauth2.HTTPClient, &http.Client{Timeout: 10 * time.Second})
	oauthConfig := googleOAuthConfig()
	token, err := oauthConfig.Exchange(ctx, c.QueryParam("code"), oauth2.VerifierOption(flow.Verifier))
	if err != nil {
		return oauthReturn(c, flow.Path, "oauth_failed")
	}
	credential, ok := token.Extra("id_token").(string)
	if !ok || credential == "" {
		return oauthReturn(c, flow.Path, "oauth_failed")
	}
	account, err := h.Auth.Google(ctx, credential, flow.Nonce, config.GoogleOAuthClientID)
	if err != nil {
		return oauthReturn(c, flow.Path, "oauth_failed")
	}
	session, err := h.Auth.NewSession(ctx, account.ID)
	if err != nil {
		return oauthReturn(c, flow.Path, "oauth_failed")
	}
	if previous, err := c.Cookie(sessionCookie); err == nil {
		_ = h.Auth.Logout(ctx, previous.Value)
	}
	c.SetCookie(authCookie(sessionCookie, session, 7*24*60*60))
	return oauthReturn(c, flow.Path, "success")
}
