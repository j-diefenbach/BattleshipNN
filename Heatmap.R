library("ggplot2")
data = read.csv(file = "data/test.txt", sep = " ");
data
heatmap <- ggplot(data = data, mapping = aes(x = row,
                                                  y = col,
                                                  fill = value)) +
  geom_tile(label = "Probability weights") +
  xlab(label = "Sample")
heatmap
