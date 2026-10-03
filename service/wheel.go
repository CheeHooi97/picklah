package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/CheeHooi97/picklah/dto"
	"github.com/CheeHooi97/picklah/model"
	"github.com/CheeHooi97/picklah/repository"
	"gorm.io/gorm"
)

var (
	wheelColorPattern = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
	ErrInvalidWheel   = errors.New("invalid wheel")
	ErrWheelNotFound  = errors.New("wheel not found")
)

type WheelService struct {
	wheels    repository.WheelRepository
	templates *TemplateService
	now       func() time.Time
	randomID  func() (string, error)
}

func NewWheelService(wheels repository.WheelRepository, templates *TemplateService) *WheelService {
	return &WheelService{wheels: wheels, templates: templates, now: time.Now, randomID: newPublicID}
}

func (s *WheelService) Publish(ctx context.Context, request dto.WheelCreateRequest) (dto.WheelResponse, error) {
	title := strings.TrimSpace(request.Title)
	if title == "" || utf8.RuneCountInString(title) > 100 || len(request.Options) < 2 {
		return dto.WheelResponse{}, ErrInvalidWheel
	}
	if request.TemplateKey != "" {
		if _, ok := s.templates.Get(request.TemplateKey); !ok {
			return dto.WheelResponse{}, ErrInvalidWheel
		}
	}

	options := make([]model.WheelOption, len(request.Options))
	imageBytes := 0
	if len(request.Appearances) != 0 && len(request.Appearances) != len(request.Options) {
		return dto.WheelResponse{}, ErrInvalidWheel
	}
	for i, option := range request.Options {
		label := strings.TrimSpace(option)
		if label == "" || utf8.RuneCountInString(label) > 80 {
			return dto.WheelResponse{}, ErrInvalidWheel
		}
		options[i] = model.WheelOption{Position: i, Label: label}
		if len(request.Appearances) > 0 {
			appearance := request.Appearances[i]
			appearance.Emoji = strings.TrimSpace(appearance.Emoji)
			appearance.GIFURL = strings.TrimSpace(appearance.GIFURL)
			if !wheelColorPattern.MatchString(appearance.Color) || utf8.RuneCountInString(appearance.Emoji) > 32 {
				return dto.WheelResponse{}, ErrInvalidWheel
			}
			bytes, valid := validateWheelImage(appearance.GIFURL)
			imageBytes += bytes
			if !valid || imageBytes > maxWheelImageBytes {
				return dto.WheelResponse{}, ErrInvalidWheel
			}
			options[i].Color, options[i].Emoji, options[i].GIFURL = appearance.Color, appearance.Emoji, appearance.GIFURL
		}
	}

	var publicID string
	for attempt := 0; attempt < 3; attempt++ {
		candidate, err := s.randomID()
		if err != nil {
			return dto.WheelResponse{}, fmt.Errorf("generate public id: %w", err)
		}
		exists, err := s.wheels.ExistsByPublicID(ctx, candidate)
		if err != nil {
			return dto.WheelResponse{}, fmt.Errorf("check public id: %w", err)
		}
		if !exists {
			publicID = candidate
			break
		}
	}
	if publicID == "" {
		return dto.WheelResponse{}, errors.New("could not allocate a unique public id")
	}

	wheel := &model.Wheel{
		PublicID:      publicID,
		SchemaVersion: 2,
		Title:         title,
		TemplateKey:   request.TemplateKey,
		Status:        "active",
		CreatedAt:     s.now().UTC(),
		Options:       options,
	}
	if err := s.wheels.Create(ctx, wheel); err != nil {
		return dto.WheelResponse{}, fmt.Errorf("save wheel: %w", err)
	}
	return toWheelResponse(wheel), nil
}

func (s *WheelService) Get(ctx context.Context, publicID string) (dto.WheelResponse, error) {
	if len(publicID) != 22 {
		return dto.WheelResponse{}, ErrWheelNotFound
	}
	wheel, err := s.wheels.GetByPublicID(ctx, publicID)
	if errors.Is(err, gorm.ErrRecordNotFound) || (err == nil && wheel == nil) {
		return dto.WheelResponse{}, ErrWheelNotFound
	}
	if err != nil {
		return dto.WheelResponse{}, fmt.Errorf("load wheel: %w", err)
	}
	return toWheelResponse(wheel), nil
}

func toWheelResponse(wheel *model.Wheel) dto.WheelResponse {
	options := make([]dto.WheelOption, len(wheel.Options))
	for i, option := range wheel.Options {
		options[i] = dto.WheelOption{Position: option.Position, Label: option.Label, Color: option.Color, Emoji: option.Emoji, GIFURL: option.GIFURL}
	}
	return dto.WheelResponse{
		PublicID: wheel.PublicID, SchemaVersion: wheel.SchemaVersion, Title: wheel.Title,
		TemplateKey: wheel.TemplateKey, Options: options, CreatedAt: wheel.CreatedAt,
	}
}

func newPublicID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}
