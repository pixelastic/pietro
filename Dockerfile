# Build from same image as CircleCI
FROM cimg/node:14.17.0
ENV CIRCLE_CI=1

# Add colored output
ENV TERM=xterm-256color

# Install pdf dependencies
COPY ./scripts/install-dependencies /tmp/install-dependencies
RUN /tmp/install-dependencies

# This is the workdir used by circleci by default
ARG WORKDIR=/home/circleci/project
WORKDIR ${WORKDIR}

# We create in the container a new user with the same name and uid as the user
# running the script (as defined by the HOST_USER and HOST_UID variables).
# This will make sure all files written by the container in shared folders will
# still be usable in the host
ARG HOST_USER
ARG HOST_UID
USER root
RUN useradd --create-home --uid ${HOST_UID} ${HOST_USER}
RUN chown -R ${HOST_USER}:${HOST_USER} ${WORKDIR}

# Copy files to container
# The actual files to be copied are defined in .dockerignore
COPY --chown=${HOST_USER} . .


# Swap the commented line to either log as root (to test installing install
# deps), or as the same user as the host (to edit files)
# USER root
USER ${HOST_USER}
