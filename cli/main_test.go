package main

import (
	"context"
	"github.com/larksuite/cli/extension/credential"
	"net/http"
	"net/url"
	"testing"
)

func TestRewrite(t *testing.T) {
	u, _ := url.Parse("http://127.0.0.1:32123")
	m := mockTransport{u}
	r, _ := http.NewRequest("GET", "https://open.feishu.cn/open-apis/calendar/v4/calendars?page_size=2", nil)
	if _, e := m.PreRoundTripE(r); e != nil {
		t.Fatal(e)
	}
	if r.URL.String() != "http://127.0.0.1:32123/open-apis/calendar/v4/calendars?page_size=2" {
		t.Fatal(r.URL)
	}
	r, _ = http.NewRequest("GET", "https://example.com/", nil)
	if _, e := m.PreRoundTripE(r); e == nil {
		t.Fatal("external host allowed")
	}
}
func TestSyntheticCredentials(t *testing.T) {
	p := mockCredentials{}
	a, e := p.ResolveAccount(context.Background())
	if e != nil || a.AppSecret != "" || a.AppID != "cli_eval" {
		t.Fatal(a, e)
	}
	tok, e := p.ResolveToken(context.Background(), credential.TokenSpec{})
	if e != nil || tok.Value != "local-evaluation-only" {
		t.Fatal("unexpected token source")
	}
}
