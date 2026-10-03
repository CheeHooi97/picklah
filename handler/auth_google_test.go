package handler

import (
	"encoding/json"
	"github.com/CheeHooi97/picklah/config"
	"github.com/labstack/echo/v4"
	"net/http/httptest"
	"testing"
)

func TestNativeGoogleConfigUsesPublicClientID(t *testing.T) {
	oldID, oldSecret := config.GoogleOAuthClientID, config.GoogleOAuthClientSecret
	defer func() { config.GoogleOAuthClientID, config.GoogleOAuthClientSecret = oldID, oldSecret }()
	config.GoogleOAuthClientID, config.GoogleOAuthClientSecret = "web-client", ""
	response := httptest.NewRecorder()
	if err := (&Handler{}).AuthConfig(echo.New().NewContext(httptest.NewRequest("GET", "/v1/auth/config", nil), response)); err != nil {
		t.Fatal(err)
	}
	var result struct {
		GoogleConfigured bool   `json:"googleConfigured"`
		NativeConfigured bool   `json:"nativeGoogleConfigured"`
		ClientID         string `json:"googleClientId"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if result.GoogleConfigured || !result.NativeConfigured || result.ClientID != "web-client" {
		t.Fatalf("unexpected config: %+v", result)
	}
}
