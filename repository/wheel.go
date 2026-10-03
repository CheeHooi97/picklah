package repository

import (
	"context"

	"github.com/CheeHooi97/picklah/model"
	"gorm.io/gorm"
)

type WheelRepository interface {
	ExistsByPublicID(ctx context.Context, publicID string) (bool, error)
	Create(ctx context.Context, wheel *model.Wheel) error
	GetByPublicID(ctx context.Context, publicID string) (*model.Wheel, error)
}

type wheelRepository struct {
	db *gorm.DB
}

func NewWheelRepository(db *gorm.DB) WheelRepository {
	return &wheelRepository{db: db}
}

func (r *wheelRepository) ExistsByPublicID(ctx context.Context, publicID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Wheel{}).Where("public_id = ?", publicID).Count(&count).Error
	return count > 0, err
}

func (r *wheelRepository) Create(ctx context.Context, wheel *model.Wheel) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		options := wheel.Options
		wheel.Options = nil
		if err := tx.Create(wheel).Error; err != nil {
			wheel.Options = options
			return err
		}
		for i := range options {
			options[i].WheelID = wheel.ID
		}
		if len(options) > 0 {
			if err := tx.CreateInBatches(&options, 500).Error; err != nil {
				wheel.Options = options
				return err
			}
		}
		wheel.Options = options
		return nil
	})
}

func (r *wheelRepository) GetByPublicID(ctx context.Context, publicID string) (*model.Wheel, error) {
	var wheel model.Wheel
	err := r.db.WithContext(ctx).
		Preload("Options", func(db *gorm.DB) *gorm.DB { return db.Order("position ASC") }).
		Where("public_id = ? AND status = ?", publicID, "active").
		First(&wheel).Error
	if err != nil {
		return nil, err
	}
	return &wheel, nil
}
