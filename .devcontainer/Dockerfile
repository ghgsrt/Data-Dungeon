# FROM node:current-alpine3.17

# RUN apk add --no-cache --update \
#     ca-certificates \
#     gcc \
#     libc6-compat \
#     wget \
#     libc-dev

# ENV RUSTUP_HOME=/usr/local/rustup \
#     CARGO_HOME=/usr/local/cargo \
#     PATH=/usr/local/cargo/bin:$PATH \
#     RUST_VERSION=1.65.0

# RUN set -eux; \
#     apkArch="$(apk --print-arch)"; \
#     case "$apkArch" in \
#         x86_64) rustArch='x86_64-unknown-linux-musl'; rustupSha256='95427cb0592e32ed39c8bd522fe2a40a746ba07afb8149f91e936cddb4d6eeac' ;; \
#         aarch64) rustArch='aarch64-unknown-linux-musl'; rustupSha256='7855404cdc50c20040c743800c947b6f452490d47f8590a4a83bc6f75d1d8eda' ;; \
#         *) echo >&2 "unsupported architecture: $apkArch"; exit 1 ;; \
#     esac; \
#     url="https://static.rust-lang.org/rustup/archive/1.25.1/${rustArch}/rustup-init"; \
#     wget "$url"; \
#     echo "${rustupSha256} *rustup-init" | sha256sum -c -; \
#     chmod +x rustup-init; \
#     ./rustup-init -y --no-modify-path --profile minimal --default-toolchain $RUST_VERSION --default-host ${rustArch}; \
#     rm rustup-init; \
#     chmod -R a+w $RUSTUP_HOME $CARGO_HOME; \
#     rustup --version; \
#     cargo --version; \
#     rustc --version;

# rahr ah oora dfggdfhfh
# RUN adduser -D -G wheel -p "Howdy123!" -h /home/dungeonMaster -v dungeonMaster \
#     echo "dungeonMaster:x:1001:1001::/home/dungeonMaster:/bin/bash" | tee -a /etc/passwd
# USER dungeonMaster
# RUN sudo chown -R dungeonMaster:wheel /

# FROM rust:alpine3.17

# RUN apk add --no-cache --update \
#     gtk+3.0-dev \
#     webkit2gtk-dev \
#     libc6-compat \
#     libc-dev \
#     openssl \
#     openssl-dev \
#     nodejs \
#     npm \
#     pkgconf

# RUN cargo install tauri-cli


# Install Rust
# ARG RUST_VERSION=1.64.0
# ARG RUSTUP_INIT_VERSION=1.24.3
# ENV RUSTUP_HOME=/usr/local/rustup \
#     CARGO_HOME=/usr/local/cargo \
#     PATH=/usr/local/cargo/bin:$PATH
# RUN wget -qO /tmp/rustup-init "https://static.rust-lang.org/rustup/archive/${RUSTUP_INIT_VERSION}/x86_64-unknown-linux-musl/rustup-init" && \
#     sha256sum /tmp/rustup-init && \
#     echo "bdf022eb7cba403d0285bb62cbc47211f610caec24589a72af70e1e900663be9  /tmp/rustup-init" | sha256sum -c - && \
#     chmod +x /tmp/rustup-init && \
#     /tmp/rustup-init -y --no-modify-path --profile minimal --default-toolchain ${RUST_VERSION} --default-host x86_64-unknown-linux-musl && \
#     rm /tmp/rustup-init && \
#     chmod -R a+w ${RUSTUP_HOME} ${CARGO_HOME}

# # Install gcc required by Rust
# RUN apk add --no-cache gcc && \
#     ln -s /usr/bin/gcc /usr/bin/x86_64-linux-musl-gcc
# # Install musl-dev required by some Rust tooling
# RUN apk add --no-cache musl-dev

# # Install Rust tooling
# ARG RUST_ANALYZER_VERSION=2022-10-31
# RUN wget -qO- "https://github.com/rust-analyzer/rust-analyzer/releases/download/${RUST_ANALYZER_VERSION}/rust-analyzer-$(uname -m)-unknown-linux-musl.gz" | \
#     gunzip > /usr/local/bin/rust-analyzer && \
#     chmod 500 /usr/local/bin/rust-analyzer
# RUN rustup component add clippy rustfmt

FROM qmcgaw/rustdevcontainer

RUN cargo install tauri-cli

# Shell setup
# COPY shell/.zshrc-specific shell/.welcome.sh /root/
# RUN mkdir ~/.zfunc && rustup completions zsh > ~/.zfunc/_rustup