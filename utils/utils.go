package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	config "github.com/CheeHooi97/picklah/config"
	"github.com/CheeHooi97/picklah/errcode"
	"io"
	r "math/rand"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
)

const (
	minSeed = int64(100000000)
	maxSeed = int64(999999999)
)

func ValidateRequest(c echo.Context, i any) (string, error) {
	if err := c.Bind(&i); err != nil {
		return errcode.InvalidRequest.Message, err
	}

	if err := c.Validate(i); err != nil {
		return errcode.ValidationError.Message, err
	}

	return "", nil
}

func EncryptAES(plaintext string) (string, error) {
	keyBytes, err := base64.StdEncoding.DecodeString(config.SystemAesKey)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(keyBytes)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := aesGCM.Seal(nil, nonce, []byte(plaintext), nil)

	encrypted := append(nonce, ciphertext...)

	return base64.StdEncoding.EncodeToString(encrypted), nil
}

func DecryptAES(encryptedText string) (string, error) {
	keyBytes, err := base64.StdEncoding.DecodeString(config.SystemAesKey)
	if err != nil {
		return "", err
	}

	data, err := base64.StdEncoding.DecodeString(encryptedText)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(keyBytes)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := aesGCM.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New(errcode.InvalidEncryptedText.Message)
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]

	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// random
var randomSeed = r.New(r.NewSource(time.Now().UnixNano()))

func Alphanumeric(n int) string {
	var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-")
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[randomSeed.Intn(len(letterRunes))]
	}
	return string(b)
}

func Numeric(n int) string {
	var letterRunes = []rune("1234567890")
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[randomSeed.Intn(len(letterRunes))]
	}

	s := string(b)
	return s
}

// GenerateUNIQ :
func UniqueID() string {
	strID := strconv.FormatInt(time.Now().Unix(), 10) + strconv.FormatInt(r.Int63n(maxSeed-minSeed)+minSeed, 10)
	return strID
}
