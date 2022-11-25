# npm-run-bg

A utility for running variadic background processes from a single npm command.
Can make things like running tunnels or small http servers easier on nodejs.

Syntax: `npm-run-bg [bg-process-1] ...[bg-process-N] [main-command]`

## Examples

You can run a tunnel in the background of your end to end tests easily

`npm-run-bg start-tunnel test-end-to-end`

You can make the main process not begin until the background process gives some
output that indicates success, as well as a timeout before which to fail
(default 5 seconds).

`npm-run-bg 'start-tunnel::Connection Ready::15000' test-end-to-end`

You can do this with as many processes as you like.

`npm-run-bg 'http-server ./static' start-tunnel test-end-to-end`

In the case of multiple delaying mechanisms, the system will launch all processes
simultaneously and assume delays are specific to each process. This can be tweaked
in the future as needed

`npm-run-bg 'http-server::Started Successfully::15000' 'start-tunnel::Connection Ready:1000' test-end-to-end`
