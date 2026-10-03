package dto

import "time"

type WheelCreateRequest struct {
	Title       string            `json:"title"`
	TemplateKey string            `json:"templateKey"`
	Options     []string          `json:"options"`
	Appearances []WheelAppearance `json:"appearances,omitempty"`
}

type WheelAppearance struct {
	Color  string `json:"color"`
	Emoji  string `json:"emoji"`
	GIFURL string `json:"gifUrl"`
}

type WheelOption struct {
	Position int    `json:"position"`
	Label    string `json:"label"`
	Color    string `json:"color,omitempty"`
	Emoji    string `json:"emoji"`
	GIFURL   string `json:"gifUrl,omitempty"`
}

type WheelResponse struct {
	PublicID      string        `json:"publicId"`
	SchemaVersion int           `json:"schemaVersion"`
	Title         string        `json:"title"`
	TemplateKey   string        `json:"templateKey,omitempty"`
	Options       []WheelOption `json:"options"`
	CreatedAt     time.Time     `json:"createdAt"`
}

type TemplateResponse struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Options     []string `json:"options"`
}

type TemplateListResponse struct {
	Templates []TemplateResponse `json:"templates"`
}

type WheelPublishResponse struct {
	PublicID string `json:"publicId"`
	URL      string `json:"url"`
}

type ErrorResponse struct {
	Error APIError `json:"error"`
}

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
