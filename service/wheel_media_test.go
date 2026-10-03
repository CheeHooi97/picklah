package service

import (
	"context"
	"encoding/base64"
	"errors"
	"testing"

	"github.com/CheeHooi97/picklah/dto"
)

func TestEmbeddedImagesPersistAndValidate(t *testing.T) {
	const image = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
	svc := NewWheelService(newMemoryWheelRepository(), NewTemplateService())
	request := dto.WheelCreateRequest{Title: "Lunch", Options: []string{"Burger", "Sushi"}, Appearances: []dto.WheelAppearance{{Color: "#112233", GIFURL: image}, {Color: "#ffcc00"}}}
	created, err := svc.Publish(context.Background(), request)
	if err != nil {
		t.Fatal(err)
	}
	loaded, err := svc.Get(context.Background(), created.PublicID)
	if err != nil || loaded.Options[0].GIFURL != image {
		t.Fatalf("embedded image lost: %v", err)
	}
	for _, source := range []string{"data:image/svg+xml;base64,PHN2Zz4=", "data:image/png;base64,R0lGODlh", "data:image/gif;base64,AAAA", "data:image/gif;base64,%%%"} {
		request.Appearances[0].GIFURL = source
		if _, err := svc.Publish(context.Background(), request); !errors.Is(err, ErrInvalidWheel) {
			t.Fatalf("accepted unsupported data: %s", source)
		}
	}
}

func TestEmbeddedImageLimits(t *testing.T) {
	image := make([]byte, maxImageBytes)
	copy(image, "GIF89a")
	source := "data:image/gif;base64," + base64.StdEncoding.EncodeToString(image)
	if size, valid := validateWheelImage(source); !valid || size != maxImageBytes {
		t.Fatal("valid maximum image rejected")
	}
	oversized := append(image, 0)
	if _, valid := validateWheelImage("data:image/gif;base64," + base64.StdEncoding.EncodeToString(oversized)); valid {
		t.Fatal("oversized image accepted")
	}
	svc := NewWheelService(newMemoryWheelRepository(), NewTemplateService())
	request := dto.WheelCreateRequest{Title: "Pick", Options: []string{"A", "B", "C"}, Appearances: []dto.WheelAppearance{{Color: "#112233", GIFURL: source}, {Color: "#112233", GIFURL: source}, {Color: "#112233", GIFURL: source}}}
	if _, err := svc.Publish(context.Background(), request); !errors.Is(err, ErrInvalidWheel) {
		t.Fatal("wheel exceeding aggregate limit accepted")
	}
}
