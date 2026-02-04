.PHONY: install show tofile cleanCache secrets.setup secrets.backup

# Arch packages
install:
	xargs paru -S --needed < arch-pkgs/pkgs.txt

show:
	paru -Qqen

tofile:
	paru -Qqen > arch-pkgs/pkgs.txt

cleanCache:
	paru -Sccd

# Secrets (AGE key for SOPS) - run before `stow .`
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
