package handler

import (
	"github.com/CheeHooi97/picklah/errcode"
	"github.com/CheeHooi97/picklah/service"
	"net/http"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	Auth      *service.AuthService
	User      *service.UserService
	Admin     *service.AdminService
	Company   *service.CompanyService
	Wheel     *service.WheelService
	Templates *service.TemplateService
}

func NewHandler(services *service.Services) *Handler {
	h := &Handler{
		User:      services.UserService,
		Admin:     services.AdminService,
		Company:   services.CompanyService,
		Wheel:     services.WheelService,
		Templates: services.TemplateService,
	}

	return h
}

func responseError(c echo.Context, message errcode.ErrorCode) error {
	return c.JSON(http.StatusOK, map[string]any{
		"result": nil,
		"errmsg": message.Message,
		"error":  true,
		"status": false,
	})
}

func responseJSON(c echo.Context, result any) error {
	return c.JSON(http.StatusOK, map[string]any{
		"result": result,
		"errmsg": "",
		"error":  false,
		"status": true,
	})
}

func responseListJSON(c echo.Context, result any) error {
	return c.JSON(http.StatusOK, map[string]any{
		"result": map[string]any{
			"groups": result,
		},
		"errmsg": "",
		"error":  false,
		"status": true,
	})
}

func responseNoContent(c echo.Context) error {
	return c.JSON(http.StatusOK, nil)
}

func responseValidationError(c echo.Context, message string) error {
	return c.JSON(http.StatusOK, map[string]any{
		"result": nil,
		"errmsg": message,
		"error":  true,
		"status": false,
	})
}
