-- Migration to rename MT5 server name
UPDATE challenges 
SET server = 'OCEAN MARKET LIMITED' 
WHERE server ILIKE '%AURO MARKETS%';
