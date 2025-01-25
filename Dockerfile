# OS
FROM alpine:3.17.3 AS base

RUN apk add --no-cache \
    imagemagick=7.1.0.62-r0 \
    zsh=5.9-r0

WORKDIR /app


# Stage: dev {{{
FROM base AS dev
CMD ["zsh"]
# }}}

# Stage: test (default) {{{
FROM base AS prod
CMD ["sh", "-c"]
# }}}
