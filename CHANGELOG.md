# Changelog

What changed in each version of this extension, newest first.

## 0.1.1

- The images and volumes lists no longer fail while containers or volumes are being removed, such as during a Compose down or a clean-up.
- A list no longer briefly shows a removed or stopped container again after an action.
- An unreadable answer from Docker is reported instead of leaving a list silently out of date.
- Apps whose names Compose did not create itself can be removed and their logs followed.
- The MongoDB console is no longer offered for mongo-express, a web UI for MongoDB.

## 0.1.0

- Created the extension.
- Added a Docker item to the navigator, with Containers, Images and Volumes under it.
- Added tabs listing local Docker containers, images and volumes, refreshed every few seconds.
- Lists can be searched and sorted by any column, and show how many items they hold.
- Container states are coloured, and ages are shown the way Lens shows them.
- Containers can be selected, one by one or all at once, and removed after confirming, from the toolbar or from a row's menu.
- Containers can be started, stopped and restarted from a row's menu, or all selected at once from the toolbar.
- Clicking a container's name opens its details in a drawer: properties, state, network, mounts and environment, with its actions at the top.
- The containers list shows each running container's CPU and memory use, and so do a container's details.
- Containers' logs can be followed, and a running container's shell opened, in a terminal tab, from a row's menu or a container's details.
- The status bar shows how many containers are running, or that Docker cannot be reached; clicking it opens the containers.
- The extension has an icon and a banner of its own.
- Images and volumes can be selected and removed, after confirming, and show which containers use them; clicking one's first column opens its details.
- The images list leaves out intermediate build layers, as `docker images` does.
- Apps: containers Docker Compose made are grouped by project, with their services, state, CPU and memory, and can be started, stopped, restarted and removed together, their logs followed in one terminal.
- The containers list shows which app a container belongs to, and so do a container's details.
- Where Docker Compose is installed, removing an app takes it down, its networks too, its logs are Compose's own, and an app can be brought up again from its compose files, pulling newer images first if asked.
- An app's details list its services as a table like the containers list: container, image, CPU, memory, ports, state and age, each with its menu; a service's name opens its container's details.
- The images list has a **Remove dangling** button, removing the untagged images no container uses after confirming.
- The volumes list shows how large each volume is, and so do a volume's details; the volumes are read every 15 seconds, as measuring them reads them on disk.
- Connect to what containers serve: web ports open in the browser from the Ports column, a row's menu or a container's details, and Postgres, MySQL/MariaDB, Redis/Valkey and MongoDB containers open a console in a terminal, with their own client and credentials.
- Live CPU and memory: a trend beside each value in the lists, and charts of the last five minutes in a running container's and an app's details, with the reading under the pointer.
- An overview of Docker, opened from **Overview** under Docker in the navigator and from the status bar: containers in trouble with their logs and a restart at hand, how many containers, apps, images and volumes there are, the CPU and memory they take, what they keep on disk and what of it can be reclaimed, the top consumers and the engine.
