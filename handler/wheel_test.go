package handler_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/CheeHooi97/picklah/dto"
	"github.com/CheeHooi97/picklah/handler"
	"github.com/CheeHooi97/picklah/model"
	"github.com/CheeHooi97/picklah/router"
	"github.com/CheeHooi97/picklah/service"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type apiWheelRepository struct {
	wheel *model.Wheel
}

func (r *apiWheelRepository) ExistsByPublicID(_ context.Context, publicID string) (bool, error) {
	return r.wheel != nil && r.wheel.PublicID == publicID, nil
}

func (r *apiWheelRepository) Create(_ context.Context, wheel *model.Wheel) error {
	copy := *wheel
	copy.Options = append([]model.WheelOption(nil), wheel.Options...)
	r.wheel = &copy
	return nil
}

func (r *apiWheelRepository) GetByPublicID(_ context.Context, publicID string) (*model.Wheel, error) {
	if r.wheel == nil || r.wheel.PublicID != publicID {
		return nil, gorm.ErrRecordNotFound
	}
	copy := *r.wheel
	copy.Options = append([]model.WheelOption(nil), r.wheel.Options...)
	return &copy, nil
}

func TestPublicWheelAPI(t *testing.T) {
	repo := &apiWheelRepository{}
	templates := service.NewTemplateService()
	wheels := service.NewWheelService(repo, templates)
	services := &service.Services{WheelService: wheels, TemplateService: templates}
	h := &handler.Handler{Wheel: services.WheelService, Templates: services.TemplateService}
	e := router.SetupRoutes(h, nil)

	create := httptest.NewRequest(http.MethodPost, "/v1/wheels", strings.NewReader(`{"title":"Lunch?","templateKey":"what-makan","options":["Sushi","Nasi Lemak"]}`))
	create.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	createResponse := httptest.NewRecorder()
	e.ServeHTTP(createResponse, create)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("POST /v1/wheels status = %d, body = %s", createResponse.Code, createResponse.Body.String())
	}
	var published dto.WheelPublishResponse
	if err := json.Unmarshal(createResponse.Body.Bytes(), &published); err != nil {
		t.Fatalf("decode publish response: %v", err)
	}
	if published.PublicID == "" || published.URL != "/w/"+published.PublicID {
		t.Fatalf("unexpected publish response: %#v", published)
	}

	get := httptest.NewRequest(http.MethodGet, "/v1/wheels/"+published.PublicID, nil)
	getResponse := httptest.NewRecorder()
	e.ServeHTTP(getResponse, get)
	if getResponse.Code != http.StatusOK {
		t.Fatalf("GET /v1/wheels/:publicId status = %d, body = %s", getResponse.Code, getResponse.Body.String())
	}
	var wheel dto.WheelResponse
	if err := json.Unmarshal(getResponse.Body.Bytes(), &wheel); err != nil {
		t.Fatalf("decode wheel response: %v", err)
	}
	if wheel.Title != "Lunch?" || len(wheel.Options) != 2 || wheel.Options[0].Label != "Sushi" {
		t.Fatalf("unexpected shared wheel: %#v", wheel)
	}

	missing := httptest.NewRequest(http.MethodGet, "/v1/wheels/AAAAAAAAAAAAAAAAAAAAAA", nil)
	missingResponse := httptest.NewRecorder()
	e.ServeHTTP(missingResponse, missing)
	if missingResponse.Code != http.StatusNotFound {
		t.Fatalf("missing wheel status = %d, want 404", missingResponse.Code)
	}
}

func TestPublicWheelAPIRejectsInvalidRequest(t *testing.T) {
	repo := &apiWheelRepository{}
	templates := service.NewTemplateService()
	h := &handler.Handler{
		Wheel: service.NewWheelService(repo, templates), Templates: templates,
	}
	e := router.SetupRoutes(h, nil)
	request := httptest.NewRequest(http.MethodPost, "/v1/wheels", strings.NewReader(`{"title":"Lunch?","options":["Sushi"]}`))
	request.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	response := httptest.NewRecorder()
	e.ServeHTTP(response, request)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("invalid wheel status = %d, want 400", response.Code)
	}
}
