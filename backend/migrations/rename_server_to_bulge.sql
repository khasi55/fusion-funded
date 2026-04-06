-- Migration to rename MT5 server name
UPDATE challenges 
SET server = 'BULGE GROUP INVESTMENT' 
WHERE server ILIKE '%AURO MARKETS%';
