install:
	paru -S - < pkgs.txt

show:
	paru -Qqen

tofile:
	paru -Qqen > pkgs.txt
