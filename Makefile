install:
	paru -S - < arch-pkgs/pkgs.txt

show:
	paru -Qqen

tofile:
	paru -Qqen > arch-pkgs/pkgs.txt

cleanCache:
	paru -Sccd 
