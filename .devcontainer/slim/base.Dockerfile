FROM golang:1.19.2-alpine3.16

ENV GOROOT /usr/local/go
ENV GOPATH /home/**/go
ENV PATH ${GOPATH}/bin:${GOROOT}/bin:${PATH}

RUN apk add --no-cache build-base nodejs-current npm git pkgconf gtk+3.0-dev webkit2gtk-dev && apk update \
    && go install -v golang.org/x/tools/gopls@latest \
    && go install github.com/wailsapp/wails/v2/cmd/wails@latest
