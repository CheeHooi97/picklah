package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/CheeHooi97/picklah/dto"
	"github.com/CheeHooi97/picklah/model"
	"gorm.io/gorm"
)

type memoryWheelRepository struct {
	wheels map[string]*model.Wheel
}

func newMemoryWheelRepository() *memoryWheelRepository {
	return &memoryWheelRepository{wheels: make(map[string]*model.Wheel)}
}

func (r *memoryWheelRepository) ExistsByPublicID(_ context.Context, publicID string) (bool, error) {
	_, exists := r.wheels[publicID]
	return exists, nil
}

func (r *memoryWheelRepository) Create(_ context.Context, wheel *model.Wheel) error {
	if _, exists := r.wheels[wheel.PublicID]; exists {
		return errors.New("duplicate public id")
	}
	copy := *wheel
	copy.Options = append([]model.WheelOption(nil), wheel.Options...)
	r.wheels[wheel.PublicID] = &copy
	return nil
}

func (r *memoryWheelRepository) GetByPublicID(_ context.Context, publicID string) (*model.Wheel, error) {
	wheel, exists := r.wheels[publicID]
	if !exists {
		return nil, gorm.ErrRecordNotFound
	}
	copy := *wheel
	copy.Options = append([]model.WheelOption(nil), wheel.Options...)
	return &copy, nil
}

func TestPublishTrimsAndPreservesDuplicateOptions(t *testing.T) {
	repo := newMemoryWheelRepository()
	templates := NewTemplateService()
	service := NewWheelService(repo, templates)
	service.now = func() time.Time { return time.Date(2026, 10, 3, 0, 0, 0, 0, time.UTC) }
	service.randomID = func() (string, error) { return "AbCdEfGh12345678901234", nil }

	created, err := service.Publish(context.Background(), dto.WheelCreateRequest{
		Title: "  Lunch?  ", TemplateKey: "what-makan",
		Options: []string{" Nasi Lemak ", "Nasi Lemak"},
	})
	if err != nil {
		t.Fatalf("Publish returned error: %v", err)
	}
	if created.Title != "Lunch?" || len(created.Options) != 2 {
		t.Fatalf("unexpected published wheel: %#v", created)
	}
	if created.Options[0].Label != "Nasi Lemak" || created.Options[1].Label != "Nasi Lemak" {
		t.Fatalf("duplicate entries were not preserved: %#v", created.Options)
	}
	if created.Options[0].Position != 0 || created.Options[1].Position != 1 {
		t.Fatalf("option order was not preserved: %#v", created.Options)
	}
}

func TestPublishRejectsInvalidWheelInput(t *testing.T) {
	tests := []struct {
		name string
		in   dto.WheelCreateRequest
	}{
		{name: "empty title", in: dto.WheelCreateRequest{Options: []string{"A", "B"}}},
		{name: "one option", in: dto.WheelCreateRequest{Title: "Pick", Options: []string{"A"}}},
		{name: "blank option", in: dto.WheelCreateRequest{Title: "Pick", Options: []string{"A", " "}}},
		{name: "unknown template", in: dto.WheelCreateRequest{Title: "Pick", TemplateKey: "unknown", Options: []string{"A", "B"}}},
		{name: "long option", in: dto.WheelCreateRequest{Title: "Pick", Options: []string{"A", "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"}}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := NewWheelService(newMemoryWheelRepository(), NewTemplateService())
			if _, err := service.Publish(context.Background(), test.in); !errors.Is(err, ErrInvalidWheel) {
				t.Fatalf("expected ErrInvalidWheel, got %v", err)
			}
		})
	}
}

func TestWheelAppearanceRoundTripAndValidation(t *testing.T) {
	svc := NewWheelService(newMemoryWheelRepository(), NewTemplateService())
	request := dto.WheelCreateRequest{Title: "Lunch", Options: []string{"Burger", "Sushi"}, Appearances: []dto.WheelAppearance{
		{Color: "#ffcc00", Emoji: "🍔", GIFURL: "https://example.com/burger.gif"},
		{Color: "#112233", Emoji: "🍣"},
	}}
	created, err := svc.Publish(context.Background(), request)
	if err != nil {
		t.Fatal(err)
	}
	loaded, err := svc.Get(context.Background(), created.PublicID)
	if err != nil {
		t.Fatal(err)
	}
	if loaded.SchemaVersion != 2 || loaded.Options[0].Color != "#ffcc00" || loaded.Options[0].Emoji != "🍔" || loaded.Options[0].GIFURL != request.Appearances[0].GIFURL {
		t.Fatalf("appearance was lost: %#v", loaded)
	}
	for _, bad := range []dto.WheelAppearance{
		{Color: "red"}, {Color: "#123456", GIFURL: "javascript:alert(1)"},
		{Color: "#123456", GIFURL: "http://example.com/a.gif"},
		{Color: "#123456", GIFURL: "https://user:secret@example.com/a.gif"},
	} {
		request.Appearances[0] = bad
		if _, err := svc.Publish(context.Background(), request); !errors.Is(err, ErrInvalidWheel) {
			t.Fatalf("accepted invalid appearance: %#v", bad)
		}
	}
	request.Appearances = request.Appearances[:1]
	if _, err := svc.Publish(context.Background(), request); !errors.Is(err, ErrInvalidWheel) {
		t.Fatal("accepted mismatched appearance count")
	}
}

func TestPublishRetriesPublicIDCollision(t *testing.T) {
	repo := newMemoryWheelRepository()
	repo.wheels["AbCdEfGh12345678901234"] = &model.Wheel{}
	service := NewWheelService(repo, NewTemplateService())
	ids := []string{"AbCdEfGh12345678901234", "ZyXwVuTs98765432109876"}
	calls := 0
	service.randomID = func() (string, error) {
		id := ids[calls]
		calls++
		return id, nil
	}

	created, err := service.Publish(context.Background(), dto.WheelCreateRequest{
		Title: "Pick", Options: []string{"A", "B"},
	})
	if err != nil {
		t.Fatalf("Publish returned error: %v", err)
	}
	if created.PublicID != ids[1] || calls != 2 {
		t.Fatalf("collision was not retried: wheel=%q calls=%d", created.PublicID, calls)
	}
}
