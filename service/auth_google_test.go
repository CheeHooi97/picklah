package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"testing"
	"time"
)

// Identity validation must fail before any account or session lookup.
type testGoogleKeys struct{ payload []byte }

func (keys testGoogleKeys) VerifySignature(context.Context, string) ([]byte, error) {
	return keys.payload, nil
}

func TestGoogleRejectsInvalidIdentity(t *testing.T) {
	for _, test := range []struct {
		name, field string
		value       any
	}{
		{"wrong audience", "aud", "another-client"},
		{"wrong nonce", "nonce", "another-attempt"},
		{"unverified email", "email_verified", false},
		{"missing subject", "sub", ""},
		{"expired token", "exp", time.Now().Add(-time.Hour).Unix()},
		{"wrong issuer", "iss", "https://attacker.example"},
	} {
		t.Run(test.name, func(t *testing.T) {
			claims := map[string]any{"iss": "https://accounts.google.com", "aud": "web-client", "sub": "google-subject", "nonce": "server-nonce", "email_verified": true, "exp": time.Now().Add(time.Hour).Unix()}
			claims[test.field] = test.value
			payload, _ := json.Marshal(claims)
			token := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"RS256"}`)) + "." + base64.RawURLEncoding.EncodeToString(payload) + ".c2ln"
			auth := &AuthService{googleKeys: testGoogleKeys{payload}}
			_, err := auth.Google(context.Background(), token, "server-nonce", "web-client")
			if !errors.Is(err, ErrAuthInvalid) {
				t.Fatalf("invalid identity accepted: %v", err)
			}
		})
	}
}

func TestNativeGoogleRejectsMalformedRequests(t *testing.T) {
	auth := &AuthService{}
	for _, request := range []struct{ token, nonce string }{{"", ""}, {"token", "short"}, {"", "0123456789012345678901234567890123456789012"}} {
		if _, err := auth.NativeGoogle(context.Background(), request.token, request.nonce, "client"); !errors.Is(err, ErrAuthInvalid) {
			t.Fatalf("malformed request accepted: %v", err)
		}
	}
}
