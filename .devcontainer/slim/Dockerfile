# https://github.com/qdm12/basedevcontainer/blob/master/alpine.Dockerfile
FROM qmcgaw/basedevcontainer:0.19.0-alpine

# https://github.com/qdm12/rustdevcontainer/blob/main/alpine.Dockerfile
# Install Rust
ARG RUST_VERSION=1.64.0
ARG RUSTUP_INIT_VERSION=1.24.3
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH
RUN wget -qO /tmp/rustup-init "https://static.rust-lang.org/rustup/archive/${RUSTUP_INIT_VERSION}/x86_64-unknown-linux-musl/rustup-init" && \
    sha256sum /tmp/rustup-init && \
    echo "bdf022eb7cba403d0285bb62cbc47211f610caec24589a72af70e1e900663be9  /tmp/rustup-init" | sha256sum -c - && \
    chmod +x /tmp/rustup-init && \
    /tmp/rustup-init -y --no-modify-path --profile minimal --default-toolchain ${RUST_VERSION} --default-host x86_64-unknown-linux-musl && \
    rm /tmp/rustup-init && \
    chmod -R a+w ${RUSTUP_HOME} ${CARGO_HOME}

# Install gcc required by Rust
RUN apk add --no-cache gcc && \
    ln -s /usr/bin/gcc /usr/bin/x86_64-linux-musl-gcc
# Install musl-dev required by some Rust tooling
RUN apk add --no-cache musl-dev

# Install Rust tooling
ARG RUST_ANALYZER_VERSION=2022-10-31
RUN wget -qO- "https://github.com/rust-analyzer/rust-analyzer/releases/download/${RUST_ANALYZER_VERSION}/rust-analyzer-$(uname -m)-unknown-linux-musl.gz" | \
    gunzip > /usr/local/bin/rust-analyzer && \
    chmod 500 /usr/local/bin/rust-analyzer
RUN rustup component add clippy rustfmt

# Shell setup
COPY shell/.zshrc-specific shell/.welcome.sh /root/
RUN mkdir ~/.zfunc && rustup completions zsh > ~/.zfunc/_rustup

RUN apk add --no-cache --update \
    openssl-dev \
    nodejs \
    npm

RUN cargo install tauri-cli