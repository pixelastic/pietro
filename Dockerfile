# OS
FROM alpine:3.21 AS base

# Install all CLI tools in a single layer for optimal Docker cache
# This layer changes rarely (only on tool version updates)
RUN apk add --no-cache \
    exiftool=13.03-r0 \
    font-dejavu=2.37-r5 \
    imagemagick=7.1.1.41-r0 \
    ocrmypdf=16.4.3-r0 \
    poppler-utils=24.02.0-r2 \
    qpdf=11.9.1-r0 \
    sudo=1.9.17_p1-r0 \
    weasyprint=63.0-r0 \
    zsh=5.9-r4

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
