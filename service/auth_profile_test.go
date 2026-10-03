package service

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestGoogleDisplayName(t *testing.T) {
	for _, test := range []struct{ label, name, given, want string }{
		{"full profile name", "Chee Hooi", "Chee", "Chee Hooi"},
		{"whitespace", "  Chee\n Hooi\t ", "", "Chee Hooi"},
		{"given name fallback", " \t", "  Chee  ", "Chee"},
		{"missing profile name", "", "", ""},
		{"unicode name", "陈 智辉", "", "陈 智辉"},
		{"unicode length limit", strings.Repeat("陈", 121), "", strings.Repeat("陈", 120)},
	} {
		t.Run(test.label, func(t *testing.T) {
			got := googleDisplayName(test.name, test.given)
			if got != test.want || !utf8.ValidString(got) {
				t.Fatalf("got %q, want %q", got, test.want)
			}
		})
	}
}
