package middleware

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// RequireWheelSubscription denies publication until a trusted account and billing
// integration can verify the current user's active subscription on the server.
// Never accept subscription status from request headers or the wheel payload.
func RequireWheelSubscription(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		return c.JSON(http.StatusForbidden, map[string]any{
			"error": map[string]string{
				"code":    "SUBSCRIPTION_REQUIRED",
				"message": "Sharing requires an active subscription. Your wheel stays on this device. Subscription sharing is not available yet.",
			},
		})
	}
}
