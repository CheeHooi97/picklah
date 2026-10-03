package middleware

import (
	"github.com/CheeHooi97/picklah/model"
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Authenticate
func Authenticate(db *gorm.DB) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			appId := c.Request().Header.Get("appId")
			appKey := c.Request().Header.Get("appKey")

			if appId == "" || appKey == "" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Missing appId or appKey"})
			}

			var company model.Company
			if err := db.Where("app_id = ? AND app_key = ?", appId, appKey).First(&company).Error; err != nil {
				return c.JSON(http.StatusForbidden, map[string]string{"error": "Unauthorized"})
			}

			return next(c)
		}
	}
}
