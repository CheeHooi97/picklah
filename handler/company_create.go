package handler

import (
	"github.com/CheeHooi97/picklah/errcode"
	"github.com/CheeHooi97/picklah/model"
	"github.com/CheeHooi97/picklah/utils"

	"github.com/labstack/echo/v4"
)

func (h *Handler) CreateCompany(c echo.Context) error {
	var i struct {
		Name string `json:"name" validate:"required"`
		Host string `json:"host"`
	}

	if msg, err := utils.ValidateRequest(c, &i); err != nil {
		return responseValidationError(c, msg)
	}

	company := new(model.Company)
	company.Id = utils.UniqueID()
	company.Name = i.Name
	company.Host = i.Host
	company.Status = true
	company.AppId = utils.Alphanumeric(20)
	company.AppKey = utils.Alphanumeric(32)
	company.DateTime()

	if err := h.Company.CreateCompany(company); err != nil {
		return responseError(c, errcode.InternalServerError)
	}

	return responseJSON(c, company)
}
