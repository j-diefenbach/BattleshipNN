library(tidyverse)
library(ggplot)
library(ggthemes)

basicProb_EqualWeight = data.frame(read.table('data/basicProb_EqualWeight.txt'))
basicProb_Hit3x = data.frame(read.table('data/basicProb_Hit3x.txt'))
improvedProb_sampled = data.frame(read.table('data/improvedProb_Method1.txt'))
improvedProb_sampled = data.frame(read.table('data/game.txt'))
improvedProb_sampled
data = improvedProb_sampled

ggplot(subset(data, V2 == 'hit'), aes(x = V1, color = V3)) + stat_ecdf(geom="smooth", pad=TRUE, na.rm = FALSE) + ggtitle("Battleship strategy") +
  xlab('turn number') + ylab('cumulative frequency distribution') + xlim(c(0,100))

ggplot(subset(data, V4 = 'smallCases'), aes(x = V1, color = V2)) + stat_ecdf(geom="smooth", pad=TRUE, na.rm = FALSE) + ggtitle("Battleship strategy") +
  xlab('turn number') + ylab('cumulative frequency distribution') + xlim(c(0,100))

data = data.frame(read.table('data/simulations.json'))
data <- data.frame(x=data[1:100,1])
plot(data)
data

# times for optimising improvedProb sampling
improvedProb_times = data.frame(read.table('data/improvedProb_calculations.txt'))
improvedProb_times = data.frame(read.table('data/improvedProb_timesMethod2.txt'))
improvedProb_times_Overall = data.frame(read.table('data/timerOverall.txt'))
improvedProb_times_Overall = data.frame(read.table('data/timerOverall1200.txt'))

improvedProb_times_ByShip = data.frame(read.table('data/timerByShip.txt'))
improvedProb_times_ByShip = data.frame(read.table('data/timerByShip1200.txt'))

improvedProb_times_ByShip
improvedProb_times_Overall

improvedProb_times
ggplot(improvedProb_times, aes(x = V1, y = V2, color = V3)) + geom_line() + xlab('turn number') + ylab('number') + xlim(c(0,100)) +
  scale_y_continuous(trans = 'log2')

ggplot(improvedProb_times_Overall, aes(x = V1, y = V2, color = V3)) + geom_line() + xlab('turn number') + ylab('number') + xlim(c(0,100)) +
  scale_y_continuous(trans = 'sqrt')  + geom_smooth(method="auto", se=TRUE, fullrange=FALSE, level=0.99)

ggplot(subset(improvedProb_times_ByShip, V3 == 'applied' | V3 == 'accounted'), aes(x = V1, y = V2, color = V4)) + xlab('turn number') + ylab('number') + 
  geom_smooth(data=subset(improvedProb_times_ByShip, V3 == 'applied'), method="auto", se=TRUE, fullrange=FALSE, level=0.75) + 
  geom_smooth(data=subset(improvedProb_times_ByShip, V3 == 'accounted'), method="auto", se=TRUE, fullrange=FALSE, level=0.75) +
  geom_point(aes(color = V4, shape = V3), size = 1)



plot <- ggplot(data, aes(x)) +
  stat_ecdf(geom="smooth",pad=TRUE) + ggtitle("Battleship strategy")
plot
ggplot(data, aes(numTurnsToWin)) +
  stat_ecdf(geom="smooth",pad=TRUE)
