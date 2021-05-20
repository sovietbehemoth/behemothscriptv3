if ! command -v deno &> /dev/null
then
curl -fsSL https://deno.land/x/install/install.sh | sh
export DENO_INSTALL="/home/$USER/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
fi
if ! command -v python3 &> /dev/null
then
sudo apt install python3
fi