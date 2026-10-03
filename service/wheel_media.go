package service

import (
	"encoding/base64"
	"net/http"
	"net/url"
	"strings"
)

const maxWheelImageBytes = 2 << 20
const maxImageBytes = 1 << 20

func validateWheelImage(source string) (int, bool) {
	if source == "" {
		return 0, true
	}
	if strings.HasPrefix(source, "data:") {
		if len(source) > base64.StdEncoding.EncodedLen(maxImageBytes)+32 {
			return 0, false
		}
		parts := strings.SplitN(source, ",", 2)
		if len(parts) != 2 {
			return 0, false
		}
		mime := strings.TrimSuffix(strings.TrimPrefix(parts[0], "data:"), ";base64")
		if parts[0] != "data:"+mime+";base64" {
			return 0, false
		}
		switch mime {
		case "image/gif", "image/png", "image/jpeg", "image/webp":
		default:
			return 0, false
		}
		decoded, err := base64.StdEncoding.Strict().DecodeString(parts[1])
		if err != nil || len(decoded) == 0 || len(decoded) > maxImageBytes || base64.StdEncoding.EncodeToString(decoded) != parts[1] || http.DetectContentType(decoded) != mime {
			return 0, false
		}
		return len(decoded), true
	}
	if len(source) > 2048 {
		return 0, false
	}
	parsed, err := url.Parse(source)
	return 0, err == nil && parsed.Scheme == "https" && parsed.Hostname() != "" && parsed.User == nil
}
