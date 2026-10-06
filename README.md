# lens-docker

Browse the Docker containers, images and volumes on your machine without leaving Lens.

## Features

- **Overview:** click **Overview** under **Docker** in the navigator, or the status bar item, for Docker at a glance. Containers that are failing, restarting or unhealthy come first, with their logs and a restart a click away; then how many containers, apps, images and volumes there are, the CPU and memory they take, what they keep on disk with buttons to reclaim the unused part, the top consumers, and the engine.
- The status bar shows how many containers are running, or that Docker cannot be reached.
- A **Docker** item in the navigator, with **Overview**, **Apps**, **Containers**, **Images** and **Volumes** under it.
- **Apps** groups the containers Docker Compose made by project: its services, how many containers run, its state, CPU and memory. Start, stop, restart or remove an app's containers together, follow all their logs in one terminal, and click an app for its details. With Docker Compose installed, removing an app takes it down, networks too, and **Up** or **Pull and up** apply its compose files again in a terminal; without Compose, everything else still works.
- Each of them opens its own tab listing what Docker has, refreshed every few seconds while the tab is shown.
- See how much CPU and memory each running container and app uses, with a live trend beside each value and charts of the last five minutes in their details.
- Search a list, sort it by any column, and see at a glance which containers are running, stopped or failed.
- Start, stop, restart and remove containers: from a row's ⋮ menu, or tick several (or all) and use the buttons in the toolbar. Removing asks to confirm first.
- Connect to what a container serves: its web ports are links in the Ports column, a row's ⋮ menu and its details, opening in your browser; Postgres, MySQL/MariaDB, Redis/Valkey and MongoDB containers open a console in a terminal, using the client and credentials inside the container, so nothing needs installing.
- Follow a container's logs, or open a shell inside a running one, in a terminal tab: from a row's ⋮ menu or the icons atop a container's details.
- **Remove dangling** in the images toolbar cleans up untagged images no container uses.
- Images and volumes show which containers use them, and volumes how large they are. Remove them the same way as containers, and click an image's repository or a volume's name for its details: an image's tags, digests, platform, layers and command; a volume's size, mountpoint, options and labels.
- Click a container's name to open its details in a drawer over the list: when it was created, its command, state, exit code, restarts, ports, networks, mounts and environment.

## Settings

Under **Preferences → Extensions → lens-docker**:

- **Connection:** which Docker engine to use, as a context (pick one of those Docker knows) or a host such as `unix:///…/docker.sock` or `ssh://user@host`; where the `docker` command is, when Lens does not find it; and **Test connection**, which shows the engine's version or why it cannot be reached.
- **Refreshing:** how often Docker is read again, and whether CPU and memory, and volume sizes, are measured: turning them off saves Docker the work.
- **Clean-ups:** whether the overview's clean-ups remove tagged images and named volumes too, or only dangling images and anonymous volumes.

## Install

[Open lens-docker in Lens](https://app.k8slens.dev/lens-launcher?c=lens%3A%2F%2Fapp%2Fopen%2Fextension%3Fname%3Dlens-docker) and click Install there. The link offers Lens for download when it is not installed yet.

## Usage

Expand **Docker** in the navigator and click **Containers**, **Images** or **Volumes** to open its list in a tab. The extension reads from the `docker` command on your machine, so Docker must be installed and its daemon running; when it is not, the tab says the list could not be loaded.

What changed in each version is in [CHANGELOG.md](./CHANGELOG.md).
