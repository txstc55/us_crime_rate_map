f = open("../../public/Usa_counties_large.svg")

county_list = []

for line in f:
    l = line.strip()
    if l.startswith("<title>"):
        l = l.strip("<title>").strip("</title>")
        county_list.append(l.split(", "))

# print(county_list)
    
print(len(county_list))