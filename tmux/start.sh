#!/bin/sh
# create a new session. Note the -d flag, we do not want to attach just yet!
tmux new-session -s main -n 'mainWindow' -d

# split the window horizontally
tmux split-window -h -l 10
# split the window vertically
tmux split-window -v
# selects first pane
tmux select-pane -t 0
# attach pane
tmux attach -t main
