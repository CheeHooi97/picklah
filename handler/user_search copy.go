package handler

import (
	"github.com/CheeHooi97/picklah/errcode"
	"github.com/CheeHooi97/picklah/utils"

	"github.com/labstack/echo/v4"
)

func (h *Handler) SearchUserWithoutCheckUserId(c echo.Context) error {
	var i struct {
		Username string `json:"username" validate:"required"`
	}

	if msg, err := utils.ValidateRequest(c, &i); err != nil {
		return responseValidationError(c, msg)
	}

	user, err := h.User.GetUserByUserName(i.Username)
	if err != nil {
		return responseError(c, errcode.InternalServerError)
	} else if user == nil {
		return responseError(c, errcode.UserNotFound)
	}

	return responseJSON(c, user)
}
