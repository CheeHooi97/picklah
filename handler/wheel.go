package handler

import (
	"errors"
	"net/http"

	"github.com/CheeHooi97/picklah/dto"
	"github.com/CheeHooi97/picklah/service"
	"github.com/labstack/echo/v4"
)

func (h *Handler) ListTemplates(c echo.Context) error {
	return c.JSON(http.StatusOK, dto.TemplateListResponse{Templates: h.Templates.List()})
}

func (h *Handler) CreateWheel(c echo.Context) error {
	var request dto.WheelCreateRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: dto.APIError{Code: "INVALID_REQUEST", Message: "Send a valid wheel title and choices."}})
	}

	wheel, err := h.Wheel.Publish(c.Request().Context(), request)
	if errors.Is(err, service.ErrInvalidWheel) {
		return c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: dto.APIError{Code: "INVALID_WHEEL", Message: "Check the title, at least two named choices, colors, and images. Images must be supported files up to 1 MB each and 2 MB per wheel, or direct HTTPS links."}})
	}
	if err != nil {
		c.Logger().Errorf("publish wheel: %v", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: dto.APIError{Code: "INTERNAL_ERROR", Message: "The wheel could not be shared. Your local draft is still available."}})
	}

	return c.JSON(http.StatusCreated, dto.WheelPublishResponse{PublicID: wheel.PublicID, URL: "/w/" + wheel.PublicID})
}

func (h *Handler) GetWheel(c echo.Context) error {
	wheel, err := h.Wheel.Get(c.Request().Context(), c.Param("publicId"))
	if errors.Is(err, service.ErrWheelNotFound) {
		return c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: dto.APIError{Code: "WHEEL_NOT_FOUND", Message: "This shared wheel is unavailable."}})
	}
	if err != nil {
		c.Logger().Errorf("get wheel: %v", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: dto.APIError{Code: "INTERNAL_ERROR", Message: "The wheel could not be loaded."}})
	}
	return c.JSON(http.StatusOK, wheel)
}
