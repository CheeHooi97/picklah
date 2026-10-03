package handler

import (
	"github.com/CheeHooi97/picklah/errcode"
	"github.com/CheeHooi97/picklah/utils"

	"github.com/labstack/echo/v4"
)

func (h *Handler) GetCompany(c echo.Context) error {
	var i struct {
		Id string `json:"id" validate:"required"`
	}

	if msg, err := utils.ValidateRequest(c, &i); err != nil {
		return responseValidationError(c, msg)
	}

	company, err := h.Company.GetCompanyById(i.Id)
	if err != nil {
		return responseError(c, errcode.InternalServerError)
	} else if company == nil {
		return responseError(c, errcode.CompanyNotFound)
	}

	return responseJSON(c, company)
}
