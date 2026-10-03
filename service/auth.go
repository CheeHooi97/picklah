package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"github.com/CheeHooi97/picklah/model"
	"github.com/CheeHooi97/picklah/repository"
	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"net/http"
	"regexp"
	"strings"
	"time"
)

var ErrAuthInvalid = errors.New("invalid credentials")
var ErrUsernameTaken = errors.New("username unavailable")
var usernamePattern = regexp.MustCompile(`^[a-z0-9_]{3,32}$`)

type AuthService struct {
	accounts   *repository.AccountRepository
	dummyHash  []byte
	googleKeys oidc.KeySet
}

func NewAuthService(accounts *repository.AccountRepository) *AuthService {
	dummy, _ := bcrypt.GenerateFromPassword([]byte("picklah-dummy-password"), 12)
	client := &http.Client{Timeout: 10 * time.Second}
	ctx := oidc.ClientContext(context.Background(), client)
	return &AuthService{accounts: accounts, dummyHash: dummy, googleKeys: oidc.NewRemoteKeySet(ctx, "https://www.googleapis.com/oauth2/v3/certs")}
}
func authToken() (string, error) {
	var data [32]byte
	if _, err := rand.Read(data[:]); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(data[:]), nil
}

func (s *AuthService) NewGoogleChallenge(ctx context.Context) (string, error) {
	nonce, err := authToken()
	if err != nil {
		return "", err
	}
	return nonce, s.accounts.SaveGoogleChallenge(ctx, SessionHash(nonce))
}

func (s *AuthService) NativeGoogle(ctx context.Context, credential, nonce, clientID string) (*model.Account, error) {
	if len(nonce) != 43 || credential == "" || len(credential) > 16384 {
		return nil, ErrAuthInvalid
	}
	if err := s.accounts.ConsumeGoogleChallenge(ctx, SessionHash(nonce)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAuthInvalid
		}
		return nil, err
	}
	return s.Google(ctx, credential, nonce, clientID)
}
func SessionHash(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
func (s *AuthService) Register(ctx context.Context, username, password string) (*model.Account, error) {
	username = strings.ToLower(strings.TrimSpace(username))
	if !usernamePattern.MatchString(username) || len(password) < 10 || len(password) > 72 {
		return nil, ErrAuthInvalid
	}
	if _, err := s.accounts.ByUsername(ctx, username); err == nil {
		return nil, ErrUsernameTaken
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return nil, err
	}
	id, err := authToken()
	if err != nil {
		return nil, err
	}
	account := &model.Account{ID: id, Username: username, PasswordHash: string(hash)}
	if err = s.accounts.Create(ctx, account); err != nil {
		if _, lookupErr := s.accounts.ByUsername(ctx, username); lookupErr == nil {
			return nil, ErrUsernameTaken
		}
		return nil, err
	}
	return account, nil
}
func (s *AuthService) Login(ctx context.Context, username, password string) (*model.Account, error) {
	if len(password) > 72 {
		return nil, ErrAuthInvalid
	}
	account, err := s.accounts.ByUsername(ctx, strings.ToLower(strings.TrimSpace(username)))
	hash := s.dummyHash
	if err == nil && account.PasswordHash != "" {
		hash = []byte(account.PasswordHash)
	}
	valid := bcrypt.CompareHashAndPassword(hash, []byte(password)) == nil
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if err != nil || account.PasswordHash == "" || !valid {
		return nil, ErrAuthInvalid
	}
	return account, nil
}
func (s *AuthService) Google(ctx context.Context, credential, nonce, clientID string) (*model.Account, error) {
	verifier := oidc.NewVerifier("https://accounts.google.com", s.googleKeys, &oidc.Config{ClientID: clientID})
	token, err := verifier.Verify(ctx, credential)
	if err != nil {
		return nil, ErrAuthInvalid
	}
	var claims struct {
		Nonce         string `json:"nonce"`
		EmailVerified bool   `json:"email_verified"`
		Name          string `json:"name"`
		GivenName     string `json:"given_name"`
	}
	if token.Claims(&claims) != nil || nonce == "" || claims.Nonce != nonce || !claims.EmailVerified || token.Subject == "" {
		return nil, ErrAuthInvalid
	}
	account, err := s.accounts.ByGoogleSubject(ctx, token.Subject)
	if err == nil {
		if name := googleDisplayName(claims.Name, claims.GivenName); name != "" && name != account.DisplayName {
			if err := s.accounts.UpdateDisplayName(ctx, account, name); err != nil {
				return nil, err
			}
		}
		return account, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	id, err := authToken()
	if err != nil {
		return nil, err
	}
	// Google identities are separate from password accounts; never auto-link by email.
	account = &model.Account{ID: id, Username: "google_" + SessionHash(id)[:16], DisplayName: googleDisplayName(claims.Name, claims.GivenName), GoogleSubject: &token.Subject}
	if err = s.accounts.Create(ctx, account); err != nil {
		if existing, lookupErr := s.accounts.ByGoogleSubject(ctx, token.Subject); lookupErr == nil {
			return existing, nil
		}
		return nil, err
	}
	return account, nil
}

func googleDisplayName(name, givenName string) string {
	name = strings.Join(strings.Fields(name), " ")
	if name == "" {
		name = strings.Join(strings.Fields(givenName), " ")
	}
	characters := []rune(name)
	if len(characters) > 120 {
		return string(characters[:120])
	}
	return name
}
func (s *AuthService) NewSession(ctx context.Context, accountID string) (string, error) {
	token, err := authToken()
	if err != nil {
		return "", err
	}
	err = s.accounts.SaveSession(ctx, &model.AccountSession{TokenHash: SessionHash(token), AccountID: accountID, ExpiresAt: time.Now().Add(7 * 24 * time.Hour)})
	return token, err
}
func (s *AuthService) Current(ctx context.Context, token string) (*model.Account, error) {
	return s.accounts.SessionAccount(ctx, SessionHash(token))
}
func (s *AuthService) Logout(ctx context.Context, token string) error {
	return s.accounts.DeleteSession(ctx, SessionHash(token))
}
