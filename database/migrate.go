package database

import (
	"fmt"
	"github.com/CheeHooi97/picklah/model"
	"strings"

	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) error {
	models := []any{
		&model.Account{},
		&model.AccountSession{},
		&model.GoogleChallenge{},
		&model.User{},
		&model.Admin{},
		&model.Company{},
		&model.Wheel{},
		&model.WheelOption{},
	}
	err := db.AutoMigrate(models...)
	if err != nil {
		return err
	}
	// AutoMigrate can treat varchar and text as compatible without widening the
	// existing column. Attached image data requires PostgreSQL's text type.
	columns, err := db.Migrator().ColumnTypes(&model.WheelOption{})
	if err != nil {
		return err
	}
	for _, column := range columns {
		if column.Name() == "gif_url" && !strings.EqualFold(column.DatabaseTypeName(), "text") {
			if err := db.Exec(`ALTER TABLE "picklah_wheel_options" ALTER COLUMN "gif_url" TYPE text`).Error; err != nil {
				return err
			}
		}
	}
	columns, err = db.Migrator().ColumnTypes(&model.WheelOption{})
	if err != nil {
		return err
	}
	for _, column := range columns {
		if column.Name() == "gif_url" && strings.EqualFold(column.DatabaseTypeName(), "text") {
			return nil
		}
	}
	return fmt.Errorf("wheel image storage migration did not produce a text column")
}
