package model

import "time"

// Wheel is an immutable public snapshot of a user's wheel.
type Wheel struct {
	ID            uint          `gorm:"column:id;primaryKey"`
	PublicID      string        `gorm:"column:public_id;size:22;not null;uniqueIndex"`
	SchemaVersion int           `gorm:"column:schema_version;not null"`
	Title         string        `gorm:"column:title;size:100;not null"`
	TemplateKey   string        `gorm:"column:template_key;size:64;not null;default:''"`
	Status        string        `gorm:"column:status;size:16;not null;default:active;index"`
	CreatedAt     time.Time     `gorm:"column:created_at;not null"`
	Options       []WheelOption `gorm:"foreignKey:WheelID;constraint:OnDelete:CASCADE"`
}

func (Wheel) TableName() string { return "picklah_wheels" }

// WheelOption is an ordered entry. Duplicate labels remain distinct choices.
type WheelOption struct {
	ID       uint   `gorm:"column:id;primaryKey"`
	WheelID  uint   `gorm:"column:wheel_id;not null;uniqueIndex:wheel_option_position"`
	Position int    `gorm:"column:position;not null;uniqueIndex:wheel_option_position"`
	Label    string `gorm:"column:label;size:80;not null"`
	Color    string `gorm:"column:color;size:7;not null;default:''"`
	Emoji    string `gorm:"column:emoji;size:128;not null;default:''"`
	GIFURL   string `gorm:"column:gif_url;type:text;not null;default:''"`
}

func (WheelOption) TableName() string { return "picklah_wheel_options" }
