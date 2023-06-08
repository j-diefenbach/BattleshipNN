library("ggplot2")
data = read.csv(file = "data/test.txt", sep = " ");
data
heatmap <- ggplot(data = data, mapping = aes(x = col,
                                                  y = row,
                                                  fill = value)) +
  geom_tile()

heatmap

