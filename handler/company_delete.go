package handler

import (
	"github.com/CheeHooi97/picklah/errcode"

	"github.com/labstack/echo/v4"
)

func (h *Handler) DeleteCompany(c echo.Context) error {
	id := c.Param("id")

	if err := h.Company.DeleteCompany(id); err != nil {
		return responseError(c, errcode.InternalServerError)
	}

	return responseNoContent(c)
}
