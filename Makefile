.PHONY: install show tofile cleanCache secrets.setup secrets.backup

UNAME := $(shell uname)

ifeq ($(UNAME), Darwin)
# macOS targets
install:
	brew bundle --file=macos-pkgs/Brewfile

tofile:
	brew bundle dump --file=macos-pkgs/Brewfile --force

show:
	brew list

cleanCache:
	brew cleanup
else
# Arch Linux targets (got from here: https://superuser.com/questions/1061612/how-do-you-make-a-list-file-for-pacman-to-install-from)
install:
	paru -S --needed --noconfirm - < arch-pkgs/pkgs.txt

show:
	paru -Qqen

tofile:
	paru -Qqen > arch-pkgs/pkgs.txt

cleanCache:
	paru -Sccd
endif

# Secrets (AGE key for SOPS)
secrets.setup:
	@mkdir -p ~/.config/sops/age
	@op read "op://Personal/SOPS AGE Key/notes" > ~/.config/sops/age/keys.txt
	@chmod 600 ~/.config/sops/age/keys.txt
	@echo "AGE key restored from 1Password"

secrets.backup:
	@echo "Store this in 1Password as 'SOPS AGE Key' (notes field):"
	@echo "---"
	@cat ~/.config/sops/age/keys.txt
	@echo "---"
