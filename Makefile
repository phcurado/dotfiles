.PHONY: secrets.backup

secrets.backup:
	@echo "Store this in 1Password as 'SOPS AGE Key' (notes field):"
	@echo "---"
	@cat ~/.config/sops/age/keys.txt
	@echo "---"
