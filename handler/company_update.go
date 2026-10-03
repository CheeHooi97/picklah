package handler

import (
	"github.com/CheeHooi97/picklah/errcode"
	"github.com/CheeHooi97/picklah/utils"

	"github.com/labstack/echo/v4"
)

func (h *Handler) UpdateCompany(c echo.Context) error {
	id := c.Param("id")

	var i struct {
		Name string `json:"name"`
		Host string `json:"host"`
	}

	if msg, err := utils.ValidateRequest(c, &i); err != nil {
		return responseValidationError(c, msg)
	}

	company, err := h.Company.GetCompanyById(id)
	if err != nil {
		return responseError(c, errcode.InternalServerError)
	} else if company == nil {
		return responseError(c, errcode.CompanyNotFound)
	}

	if i.Name != "" {
		company.Name = i.Name
	}

	if i.Host != "" {
		company.Host = i.Host
	}

	company.UpdateDt()
	if err := h.Company.UpdateCompany(company); err != nil {
		return responseError(c, errcode.InternalServerError)
	}

	return responseNoContent(c)
}
