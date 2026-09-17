// Evaluation-only host for the unmodified upstream lark-cli command tree.
package main

import (
	"context"
	"fmt"
	"github.com/larksuite/cli/cmd"
	"github.com/larksuite/cli/extension/credential"
	"github.com/larksuite/cli/extension/transport"
	"net/http"
	"net/url"
	"os"
)

type mockCredentials struct{}

func (mockCredentials) Name() string  { return "local-evaluation" }
func (mockCredentials) Priority() int { return 10000 }
func (mockCredentials) ResolveAccount(context.Context) (*credential.Account, error) {
	return &credential.Account{AppID: "cli_eval", Brand: credential.BrandFeishu, DefaultAs: credential.IdentityUser, OpenID: "ou_eval", SupportedIdentities: credential.SupportsAll}, nil
}
func (mockCredentials) ResolveToken(context.Context, credential.TokenSpec) (*credential.Token, error) {
	return &credential.Token{Value: "local-evaluation-only", Source: "synthetic"}, nil
}

type mockTransport struct{ endpoint *url.URL }

func (m mockTransport) Name() string                                             { return "local-evaluation" }
func (m mockTransport) ResolveInterceptor(context.Context) transport.Interceptor { return m }
func (m mockTransport) PreRoundTrip(*http.Request) func(*http.Response, error)   { return nil }
func (m mockTransport) PreRoundTripE(r *http.Request) (func(*http.Response, error), error) {
	if r.URL.Hostname() != "open.feishu.cn" && r.URL.Hostname() != "open.larksuite.com" {
		return nil, fmt.Errorf("evaluation blocks outbound host %q", r.URL.Hostname())
	}
	r.Header.Set("X-Eval-Original-Host", r.URL.Host)
	r.URL.Scheme = m.endpoint.Scheme
	r.URL.Host = m.endpoint.Host
	r.Host = m.endpoint.Host
	return nil, nil
}
func main() {
	u, err := url.Parse(os.Getenv("FEISHU_MOCK_URL"))
	if err != nil || u == nil || u.Scheme != "http" || u.Hostname() != "127.0.0.1" || u.Port() == "" || u.User != nil || u.RawQuery != "" || u.Path != "" {
		fmt.Fprintln(os.Stderr, "FEISHU_MOCK_URL must be http://127.0.0.1:<port>; this binary never uses production credentials")
		os.Exit(2)
	}
	credential.Register(mockCredentials{})
	transport.Register(mockTransport{u})
	os.Exit(cmd.Execute())
}
