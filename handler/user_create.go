package handler

import (
	"github.com/CheeHooi97/picklah/errcode"
	"github.com/CheeHooi97/picklah/model"
	"github.com/CheeHooi97/picklah/utils"
	"net/http"

	"github.com/labstack/echo/v4"
)

func (h *Handler) CreateUser(c echo.Context) error {
	if err := c.Request().ParseMultipartForm(32 << 20); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid multipart form")
	}

	companyId := c.FormValue("companyId")
	username := c.FormValue("username")
	email := c.FormValue("email")

	if companyId == "" || username == "" {
		return responseError(c, errcode.CompanyIdAndUserNameFieldRequired)
	}

	user, err := h.User.GetUserByUserNameAndCompanyId(username, companyId)
	if err != nil {
		return responseError(c, errcode.InternalServerError)
	}

	if user != nil && user.Username == username {
		return responseJSON(c, user)
	}

	newUser := new(model.User)
	newUser.Id = utils.UniqueID()
	newUser.CompanyId = companyId
	newUser.Username = username
	newUser.Email = email
	newUser.Status = true
	newUser.DateTime()

	if err := h.User.CreateUser(newUser); err != nil {
		return responseError(c, errcode.InternalServerError)
	}

	return responseJSON(c, newUser)
}
