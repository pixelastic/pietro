# OS
FROM alpine:3.17.3 AS base

RUN apk add --no-cache \
    imagemagick=7.1.0.62-r0 \
    poppler-utils=22.11.0-r0 \
    qpdf=11.2.0-r0 \
    sudo=1.9.12_p2-r1 \
    zsh=5.9-r0

# Run with same user as host, but with sudo privileges
ARG USER_NAME
ARG USER_ID
RUN adduser -D -u $USER_ID $USER_NAME \
        && adduser $USER_NAME wheel \
        && echo '%wheel ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
USER $USER_NAME

WORKDIR /app


# Stage: dev {{{
FROM base AS dev
CMD ["zsh"]
# }}}

# Stage: test (default) {{{
FROM base AS prod
CMD ["sh", "-c"]
# }}}
