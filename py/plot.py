from matplotlib import pyplot as plt
from tempfile import TemporaryFile
from datetime import date
# this shit is tested
#Generate Shitty Data
xs = []

for i in range(28):
	 xs.append(date(2018, 9, i+1))

ys = []

from random import randint
for i in range(28):
	ys.append(randint(1000,10000))

# plot shit

fig, ax = plt.subplots(1)
fig.autofmt_xdate()
ax.plot(xs,ys)
ax.set_xlabel("date")
ax.set_ylabel("moneyyyy")
plt.title("SUBIIIIIi")
#plt.show 

# save shit
f = TemporaryFile()
plt.savefig(f, format = "png")
f.seek(0)
content = f.read()
f.close()

# put it in a file once it's done
g = open("a.png", "wb")
g.write(content)
g.close()



